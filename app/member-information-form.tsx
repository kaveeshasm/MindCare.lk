import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';


export default function CounselorRegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
  router.replace({
    pathname: '/(main-tabs)/profile',
    params: {
      filledName: `${firstName} ${lastName}`.trim(),
      filledEmail: '',
      filledGender: gender,
      filledDob: dob ? formatDob(dob) : '',
    },
  });
};

  const formatDob = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself so we can personalize your experience</Text>

        <View style={styles.formPanel}>
          <View pointerEvents="none" style={styles.bottomArc} />
          <ScrollView
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>

            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={18} color="#5D5D5D" />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#828282"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={18} color="#5D5D5D" />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#828282"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerWrap}>
              <Feather name="users" size={18} color="#5D5D5D" />
              <Picker
                selectedValue={gender}
                onValueChange={(value) => setGender(value)}
                style={styles.picker}
                dropdownIconColor="#5D5D5D"
              >
                <Picker.Item label="Select Gender" value="" color="#828282" />
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                <Picker.Item label="Prefer not to say" value="Prefer not to say" />
              </Picker>
            </View>

            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity style={styles.inputWrap} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
              <Feather name="calendar" size={18} color="#5D5D5D" />
              <Text style={[styles.input, !dob && { color: '#828282' }]}>
                {dob ? formatDob(dob) : 'Select Date of Birth'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dob ?? new Date(2000, 0, 1)}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDob(selectedDate);
                }}
              />
            )}

            <TouchableOpacity style={styles.saveButton} activeOpacity={0.9} onPress={handleSave}>
              <Text style={styles.signUpText}>Save</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              Your personal information is kept private and encrypted. We never share your data without consent.
            </Text>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2F88E8',
  },
  container: {
    flex: 1,
    backgroundColor: '#2F88E8',
  },
  title: {
    marginTop: 24,
    paddingLeft: 20,
    textAlign: 'left',
    fontFamily: 'Inter',
    fontSize: 30,
    lineHeight: 36,
    color: '#FFFFFF',
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.20)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 18,
    textAlign: 'left',
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: '#E8F1FD',
    fontWeight: '500',
    paddingHorizontal: 24,
  },
  formPanel: {
    flex: 1,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
    backgroundColor: '#F3F4F6',
    paddingTop: 35,
    overflow: 'hidden',
  },
  formContent: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    zIndex: 2,
  },
  label: {
    marginTop: 20,
    marginBottom: 4,
    fontFamily: 'Inter',
    fontSize: 12.5,
    lineHeight: 19,
    color: '#161616',
    fontWeight: '500',
  },
  inputWrap: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 24,
    color: '#232323',
  },
  pickerWrap: {
  height: 42,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  borderBottomWidth: 1,        
  borderBottomColor: '#E0E0E0',
},
picker: {
  flex: 1,
  color: '#232323',
  marginLeft: -8,             
},
  saveButton: {
    marginTop: 50,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 28,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  signInRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signInPrompt: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 19,
    color: '#3D3D3D',
    fontWeight: '600',
  },
  signInLink: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 19,
    color: '#0F8AF1',
    fontWeight: '700',
  },
  termsText: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 15,
    color: '#7E7E7E',
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  bottomArc: {
    position: 'absolute',
    width: 430,
    height: 320,
    backgroundColor: '#2F88E8',
    left: -70,
    bottom: -230,
    borderTopLeftRadius: 5400,
    borderTopRightRadius: 2100,
    opacity: 0.96,
    zIndex: 0,
  },
});
